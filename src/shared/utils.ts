
export const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const randomElement = (array: any[]) => {
    return array[Math.floor(Math.random() * array.length)];
}

export const wordsAreClose = (word1: string, word2: string): boolean => {
    word1 = word1.toLowerCase();
    word2 = word2.toLowerCase();
    if (word1.length >= (word2.length - 2) && word2.indexOf(word1) > -1) {        
        return true;
    }
    return false;
}