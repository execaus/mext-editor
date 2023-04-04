import Mext from './src/Mext';
import './src/style.css';
import MextModel from './src/mext/types/MextModel';
import MextTokenType from './src/mext/tokens/MextTokenType';
import FontSize from './src/mext/types/FontSize';
import TextAlign from './src/mext/types/TextAlign';
import MextFormat from './src/mext/types/MextFormat';

const textElement = document.querySelector('#edit');
const consoleElement = document.querySelector('#console');
const tokensButtonElement = document.querySelector('#tokens');
if (textElement === null || consoleElement === null || tokensButtonElement === null) {
	throw new Error('required elements not found');
}

const mext = new Mext(textElement as HTMLElement);
mext.enableEditable();

const model: MextModel = {
	id: '1',
	align: TextAlign.LEFT,
	lineHeight: 1,
	tokens: [
		{
			type: MextTokenType.String,
			content: [...'Hello '].map(ch => ch.codePointAt(0) as number),
			format: MextFormat.None,
			color: 'gray',
			fontSize: FontSize.Pt16,
			fontFamily: 'Arial',
		},
		{
			type: MextTokenType.String,
			content: [...'my '].map(ch => ch.codePointAt(0) as number),
			format: MextFormat.None,
			color: 'gray',
			fontSize: FontSize.Pt16,
			fontFamily: 'Arial',
		},
		{
			type: MextTokenType.String,
			content: [...'like mommy!'].map(ch => ch.codePointAt(0) as number),
			format: MextFormat.None,
			color: 'gray',
			fontSize: FontSize.Pt16,
			fontFamily: 'Arial',
		},
	],
};
mext.setModel(model);
setTimeout(() => {
	mext.setColor('red');
	// mext.setFontSize(FontSize.Pt28);
}, 3000);

tokensButtonElement.addEventListener('click', () => {
	consoleElement.innerHTML = mext.getModel().tokens.map(t => `${JSON.stringify(t)}`).join('\n');
});
