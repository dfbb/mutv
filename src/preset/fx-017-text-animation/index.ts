import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/017-text-animation';

registerRoot(registerVisualPreset(effect));
