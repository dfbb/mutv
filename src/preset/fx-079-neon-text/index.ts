import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/079-neon-text';

registerRoot(registerVisualPreset(effect));
