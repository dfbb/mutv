import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/030-airport-info';

registerRoot(registerVisualPreset(effect));
