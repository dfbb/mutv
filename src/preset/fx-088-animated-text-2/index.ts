import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/088-animated-text-2';

registerRoot(registerVisualPreset(effect));
