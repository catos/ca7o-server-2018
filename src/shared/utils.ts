
export const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const randomElement = (array: any[]) => {
    return array[Math.floor(Math.random() * array.length)];
}

// MEAN
// Close: ME, MEA, MEAN*, MEAN**
export const guessIsClose = (guess: string, word: string): boolean => {
    guess = guess.toLowerCase();
    word = word.toLowerCase();

    if (Math.abs(guess.length - word.length) <= 2) {
        if (word.indexOf(guess) > -1 || guess.indexOf(word) > -1) {
            return true;
        }
    }

    return false;
}