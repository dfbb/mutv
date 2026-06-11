import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/058-multilayer-text';

registerRoot(registerVisualPreset(effect));
