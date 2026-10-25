"""Intent, execution and observation are separate; imported states grant nothing."""
from e4.evidence import bind_execution


def transition(data, host):
    current, target = data['current'], data['target']
    if target == 'LOADED':
        if current['state'] != 'SELECTED' or current['instruction_hash'] != host['instruction_hash']:
            raise ValueError('LOAD_REQUIRES_SELECTED_CURRENT_CONTENT')
        return {**current, 'state': 'LOADED', 'execution': 'NOT_RUN', 'host_signal': 'NOT_OBSERVABLE'}
    if target in ('EXECUTED', 'VERIFIED', 'HOST_SIGNAL'):
        if current['state'] not in ('LOADED', 'EXECUTED', 'VERIFIED'):
            raise ValueError('LOAD_BEFORE_EXECUTION_REQUIRED')
        bound = bind_execution(host.get('proof'), current['identity'], current['instruction_hash'])
        if target == 'VERIFIED':
            from e4.results import verify
            return verify(current, data.get('task_criteria'), host.get('proof'))
        if target == 'HOST_SIGNAL':
            ack = host.get('acknowledgement')
            if (not ack or ack.get('origin') != 'LOCAL_HOST_JOB_OBSERVATION'
                    or ack.get('run_id') != bound['proof']['run_id']
                    or ack.get('host') != current['identity']['host']
                    or ack.get('process_id') != bound['proof']['process']['started']['pid']):
                raise ValueError('HOST_SIGNAL_UNOBSERVED')
            return {**current, 'host_signal': 'HOST_SIGNAL', 'acknowledgement': ack}
        return {**current, 'state': bound['state'], 'execution': bound['state'], 'execution_run_id': bound['proof']['run_id'], 'host_signal': 'NOT_OBSERVABLE'}
    raise ValueError('TRANSITION_UNSUPPORTED')
