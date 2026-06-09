import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';
import {StudioControlBar} from '../StudioControlBar';
import {FontLoader} from '../FontLoader';

export const MyComposition: React.FC<MVInputProps> = ({
	audioFileName,
	backgroundImage,
	backgroundVideo,
	backgroundAnim,
	backgroundCarousel,
	backgroundAnimBeat,
	backgroundAnimKind,
	lyrics,
	lyricOffset,
	title,
	fontFamily,
	fontFile,
}) => {
	const ff = (base: string) => (fontFamily ? `"${fontFamily}", ${base}` : base);
	const audioSrc = audioFileName.startsWith('http')
		? audioFileName
		: staticFile(audioFileName);

	return (
		<AbsoluteFill
			style={{
				fontSize,
				fontFamily: ff(
					'"Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
				),
				backgroundColor: 'black',
			}}
		>
			<BackgroundLayer
				backgroundVideo={backgroundVideo}
				backgroundImage={backgroundImage}
				backgroundAnim={backgroundAnim}
				backgroundCarousel={backgroundCarousel}
				audioFileName={audioFileName}
				beatReactive={backgroundAnimBeat}
				animKind={backgroundAnimKind}
				fallbackGradient="black"
			/>
			<StudioControlBar />
			<FontLoader fontFamily={fontFamily} fontFile={fontFile} />
			<Subtitles lyrics={lyrics} lyricOffset={lyricOffset} />
			<Audio src={audioSrc} />
			<Bottom audioSrc={audioSrc} title={title} />
		</AbsoluteFill>
	);
};
