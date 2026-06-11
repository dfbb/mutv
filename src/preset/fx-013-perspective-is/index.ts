import {registerRoot} from 'remotion';
import {registerVisualPreset} from '../_engine/makePreset';
import {effect} from '../_engine/effects/visual/013-perspective-is';

registerRoot(registerVisualPreset(effect));
