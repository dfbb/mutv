import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {MVInputProps} from '../../types';
import {BackgroundLayer} from '../BackgroundLayer';

export const MyComposition: React.FC<MVInputProps> = ({
	audioFileName,
	backgroundImage,
	backgroundVideo,
	backgroundAnim,
	lyrics,
	lyricOffset,
	title,
}) => {
	const audioSrc = audioFileName.startsWith('http')
		? audioFileName
		: staticFile(audioFileName);

	return (
		<AbsoluteFill
			style={{
				fontSize,
				fontFamily:
					'"Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
				backgroundColor: 'black',
			}}
		>
			<BackgroundLayer
				backgroundVideo={backgroundVideo}
				backgroundImage={backgroundImage}
				backgroundAnim={backgroundAnim}
				fallbackGradient="black"
			/>
			<Subtitles lyrics={lyrics} lyricOffset={lyricOffset} />
			<Audio src={audioSrc} />
			<Bottom audioSrc={audioSrc} title={title} />
		</AbsoluteFill>
	);
};
