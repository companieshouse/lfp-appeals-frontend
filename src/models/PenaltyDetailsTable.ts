export type TableColumn = {
    text: string;
};

export type TableRow = TableColumn[];

export type PenaltyDetailsTable = {
    caption: string,
    header: TableRow;
    madeUpToDate: string;
    tableRows: TableRow[];
};