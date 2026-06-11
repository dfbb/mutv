import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/084-text-stroke';

registerRoot(registerVisualPreset(effect));
