// eslint-disable-next-line import/no-extraneous-dependencies
import { uuid } from 'uuidv4';
import CharCode from './types/CharCode';

class MextUtils {
	/**
	 * Вернёт `true` если указанный код соответствует числу
	 */
	static isNumber = (code: number): boolean => code > 47 && code < 58;

	/**
	 * Вернёт `true` если указанный код соответствует латинским символам от A до Z
	 */
	static isAlpha = (code: number): boolean => {
		code &= ~32; // quick hack to convert any char code to uppercase char code
		return code >= 65 && code <= 90;
	};

	/**
	 * Вернёт `true` если указанный код соответствует числу или символам A-Z
	 */
	static isAlphaNumeric = (code: number): boolean => MextUtils.isNumber(code) || MextUtils.isAlpha(code);

	static isWhitespace = (ch: number): boolean => ch === CharCode.Space
		|| ch === CharCode.NBSP
		|| ch === CharCode.Tab;

	/**
	 * Вернет символьное представление кода
	 */
	static toSymbol = (code: number): string => String.fromCodePoint(code);

	static getUUID = (): string => uuid();
}

export default MextUtils;
