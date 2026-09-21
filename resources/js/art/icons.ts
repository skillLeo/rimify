/**
 * The icon registry lives in resources/js/icons. This module remains only so the components that
 * imported it before the move keep compiling; they render the same set.
 */

export { ICON_NAMES, icon, isIconName } from '../icons'
export type { IconName, IconOptions } from '../icons'
