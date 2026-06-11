import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/083-layered-text';

registerRoot(registerVisualPreset(effect));
