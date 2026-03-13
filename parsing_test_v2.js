
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
        // Create a new Fields array for this row, merging the definition with the value
        const mergedFields = fields.map((field, index) => ({
            ...field,
            Value: row[index]
        }));

        return { Fields: mergedFields };
    });

    console.log(JSON.stringify(parsedItems, null, 2));
} else {
    console.log("Invalid structure");
}
