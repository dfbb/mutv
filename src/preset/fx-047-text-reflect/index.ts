import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/047-text-reflect';

registerRoot(registerVisualPreset(effect));
