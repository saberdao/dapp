export const getPoolName = (name: string) => {
    if (name === 'scnSOL-SOL') {
        return 'INF-SOL';
    }

    return name;
}

export const getSymbol = (symbol: string) => {
    if (symbol === 'scnSOL') {
        return 'INF';
    }

    return symbol;
}

export const getLogo = (symbol: string, logo?: string) => {
    if (symbol === 'scnSOL') {
        return 'https://bafkreiflz2xxkfn33qjch2wj55bvbn33q3s4mmb6bye5pt3mpgy4t2wg4e.ipfs.nftstorage.link/';
    }

    return logo;
}