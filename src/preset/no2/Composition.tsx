import {AbsoluteFill, Audio, Img, staticFile} from 'remotion';
import {Bottom} from './Bottom';
import {fontSize} from './Dots';
import {Subtitles} from './Subtitles';
import {MVInputProps} from '../../types';

export const MyComposition: React.FC<MVInputProps> = ({
	audioFileName,
	backgroundImage,
	lyrics,
	lyricOffset,
	title,
}) => {
	const audioSrc = audioFileName.startsWith('http')
		? audioFileName
		: staticFile(audioFileName);
	const bgSrc = backgroundImage
		? backgroundImage.startsWith('http')
			? backgroundImage
			: staticFile(backgroundImage)
		: '';

	return (
		<AbsoluteFill
			style={{
				fontSize,
				fontFamily:
					'"Noto Sans CJK SC", "Noto Sans CJK JP", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
				backgroundColor: 'black',
			}}
		>
			{bgSrc ? (
				<AbsoluteFill>
					<Img
						src={bgSrc}
						style={{width: '100%', height: '100%', objectFit: 'cover'}}
					/>
				</AbsoluteFill>
			) : null}
			<Subtitles lyrics={lyrics} lyricOffset={lyricOffset} />
			<Audio src={audioSrc} />
			<Bottom audioSrc={audioSrc} title={title} />
		</AbsoluteFill>
	);
};
