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
        if target != 'EXECUTED':
            raise ValueError('RESULT_VERIFICATION_REQUIRED')
        return {**current, 'state': bound['state'], 'execution': bound['state'], 'execution_run_id': bound['proof']['run_id'], 'host_signal': 'NOT_OBSERVABLE'}
    raise ValueError('TRANSITION_UNSUPPORTED')
