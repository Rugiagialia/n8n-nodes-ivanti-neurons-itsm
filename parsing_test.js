
const responseData = {
    Fields: [
        { Name: "Description", Language: "en-US", CultureDisplay: "en-US" },
        { Name: "Aprašymas", Language: "lt", CultureDisplay: "Lithuanian (Lithuania)" }
    ],
    Data: [
        ["NENAUDOTI naujų paslaugų registravimui.", ""]
    ]
};

if (responseData && responseData.Fields && responseData.Data) {
    const fields = responseData.Fields;
    const dataRows = responseData.Data;

    const parsedItems = dataRows.map((row) => {
        const item = {};
        row.forEach((value, index) => {
            if (fields[index]) {
                const key = fields[index].Language || fields[index].Name;
                item[key] = value;
            }
        });
        return item;
    });

    console.log(JSON.stringify(parsedItems, null, 2));
} else {
    console.log("Invalid structure");
}
