import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/049-sweet-stuff';

registerRoot(registerVisualPreset(effect));
