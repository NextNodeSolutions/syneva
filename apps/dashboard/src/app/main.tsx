import '@syneva/design-system/fonts.css'
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

const container = document.getElementById('root')
if (!container)
	throw new Error('index.html needs a #root element for the app to mount in.')

createRoot(container).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
