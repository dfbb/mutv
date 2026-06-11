import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/059-css-sticker';

registerRoot(registerVisualPreset(effect));
