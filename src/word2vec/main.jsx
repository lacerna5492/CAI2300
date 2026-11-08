import React from 'react';
import { createRoot } from 'react-dom/client';
import Explorer from './Explorer.jsx';
import '../styles.css';
import '../responsive.css';
import './explorer.css';

createRoot(document.getElementById('root')).render(<Explorer />);
