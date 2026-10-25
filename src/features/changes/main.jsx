import {createRoot} from 'react-dom/client';
import {I18nProvider} from '../../i18n/I18nProvider.jsx';
import DraftStudio from './DraftStudio.jsx';
import '../phase0/phase0.css';
import './draft.css';
createRoot(document.getElementById('root')).render(<I18nProvider persist={false}><DraftStudio/></I18nProvider>);
