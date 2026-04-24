const { stringify } = require('csv-stringify/sync');

const generateCsv = (data, columns) => {
  if (!data || data.length === 0) {
    return '';
  }

  const cols = columns || Object.keys(data[0]);

  const records = data.map(row => {
    const record = {};
    cols.forEach(col => {
      let value = row[col];
      if (value && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      record[col] = value != null ? String(value) : '';
    });
    return record;
  });

  return stringify(records, {
    header: true,
    columns: cols
  });
};

module.exports = { generateCsv };
