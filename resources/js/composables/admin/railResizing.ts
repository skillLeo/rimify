/**
 * Whether the rail is being dragged right now — one flag for the whole panel. While it is, charts do
 * not re-measure on every frame the content area changes width (useWidth): they measure once, when
 * the drag ends.
 */

import { ref } from 'vue'

export const railResizing = ref(false)
