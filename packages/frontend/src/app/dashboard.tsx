import { createRoot } from 'react-dom/client'

import { Dashboard } from '@pages/dashboard/react/dashboard'
import { $ } from '@shared/lib/dom'

// The hub dashboard's bootstrap: one React root over the hub listing. It shares the design
// tokens and the entity/shared layers with the desk, but none of the desk's store - a
// dashboard has no review to hold, only the hub to watch.
createRoot($('root')).render(<Dashboard />)
