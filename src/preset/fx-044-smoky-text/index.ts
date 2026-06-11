import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/044-smoky-text';

registerRoot(registerVisualPreset(effect));
