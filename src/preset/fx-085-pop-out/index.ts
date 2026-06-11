import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/085-pop-out';

registerRoot(registerVisualPreset(effect));
