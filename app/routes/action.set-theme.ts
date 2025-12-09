import { createThemeAction } from 'remix-themes';
import { themeSessionResolver } from '~/services/theme.service';

export const action = createThemeAction(themeSessionResolver);
