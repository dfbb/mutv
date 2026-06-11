import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/056-multi-colored';

registerRoot(registerVisualPreset(effect));
