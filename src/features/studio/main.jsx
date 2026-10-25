import React from 'react';
import {createRoot} from 'react-dom/client';
import {I18nProvider} from '../../i18n/I18nProvider.jsx';
import StudioApp from './StudioApp.jsx';
import '../phase0/phase0.css';
import '../changes/draft.css';
import './studio.css';
createRoot(document.getElementById('root')).render(<I18nProvider persist={false}><StudioApp/></I18nProvider>);
