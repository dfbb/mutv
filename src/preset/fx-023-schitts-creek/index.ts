import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/023-schitts-creek';

registerRoot(registerVisualPreset(effect));
