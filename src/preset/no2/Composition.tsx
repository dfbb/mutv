import {AbsoluteFill, Audio, staticFile, useVideoConfig} from 'remotion';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';
import {StudioControlBar} from '../StudioControlBar';
import {FontLoader} from '../FontLoader';
import {TextColorOverride} from '../TextColorOverride';

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
	fontScale = 1,
	fontFgColor = '',
	fontBgColor = '',
}) => {
	const ff = (base: string) => (fontFamily ? `"${fontFamily}", ${base}` : base);
	const {height} = useVideoConfig();
	const audioSrc = audioFileName.startsWith('http')
		? audioFileName
		: staticFile(audioFileName);

	return (
		<AbsoluteFill
			style={{
				fontSize: Math.round((fontSize * height * fontScale) / 720),
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
			<TextColorOverride fgColor={fontFgColor} bgColor={fontBgColor} />
			<Subtitles lyrics={lyrics} lyricOffset={lyricOffset} fontScale={fontScale} />
			<Audio src={audioSrc} />
			<Bottom audioSrc={audioSrc} title={title} fontScale={fontScale} />
		</AbsoluteFill>
	);
};
