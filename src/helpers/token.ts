export const getMax = (balance: number, isSol: boolean) => {
    return !isSol ? balance : Math.max(0, Math.floor(10000 * (balance - 0.01)) / 10000);
}