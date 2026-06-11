import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/077-flickering-neon';

registerRoot(registerVisualPreset(effect));
