import {createRoot} from 'react-dom/client';
import {I18nProvider} from '../../i18n/I18nProvider.jsx';
import PhaseZero from './PhaseZero.jsx';
import './phase0.css';

createRoot(document.getElementById('root')).render(<I18nProvider persist={false}><PhaseZero /></I18nProvider>);
