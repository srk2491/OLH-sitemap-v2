"""Read quota availability using quota/status/category table header ancestry.

No fixed column offsets or invented ASP.NET control names. Unknown layouts
abort the scrape rather than producing a partially populated report.
"""
import re
import unicodedata


def _normal(value):
    return re.sub(r'[\s.\-/()\u200c\u200d]', '', unicodedata.normalize('NFC', value).lower())


def parse_quota_table(rows):
    """Resolve quota + Available + category from expanded grouped headers.

    rows is a browser DOM snapshot of direct table cells, including spans and
    location-link IDs. Never guess column offsets or ASP.NET quota control names.
    """
    grid = []
    for row_index, row in enumerate(rows):
        while len(grid) <= row_index:
            grid.append([])
        column = 0
        for cell in row['cells']:
            while column < len(grid[row_index]) and grid[row_index][column] is not None:
                column += 1
            rowspan, colspan = int(cell.get('rowSpan', 1)), int(cell.get('colSpan', 1))
            if not 1 <= rowspan <= 100 or not 1 <= colspan <= 100:
                raise ValueError('Unexpected table span; report retained.')
            for r in range(row_index, row_index + rowspan):
                while len(grid) <= r:
                    grid.append([])
                while len(grid[r]) < column + colspan:
                    grid[r].append(None)
                for c in range(column, column + colspan):
                    if grid[r][c] is not None:
                        raise ValueError('Overlapping report cells; report retained.')
                    grid[r][c] = cell
            column += colspan
    data_rows = [(i, row) for i, row in enumerate(grid)
                 if any(c and c.get('locationId') for c in row)]
    if not data_rows:
        raise ValueError('No location data rows found; report retained.')
    header_end = data_rows[0][0]
    columns = {'public': {}, 'mla': {}, 'public_stock': {}, 'mla_stock': {}}
    for col in range(len(data_rows[0][1])):
        labels = []
        for header in grid[:header_end]:
            if col < len(header) and header[col]:
                label = header[col]['text'].strip()
                if label and label not in labels:
                    labels.append(label)
        if not labels:
            continue
        context = ' '.join(_normal(label) for label in labels)
        is_available = 'ಲಭ್ಯ' in context or 'available' in context
        stock_group = _normal(labels[-2]) if len(labels) >= 3 else ''
        is_stock = stock_group in ('ಒಟ್ಟುಫ್ಲಾಟ್ಗಳು', 'totalflats', 'totalstock', 'stock')
        if not is_available and not is_stock:
            continue
        public = 'ಸಾರ್ವಜನಿಕ' in context or 'public' in context
        local = 'ಸ್ಥಳೀಯ' in context or any(v in context for v in ('mla', 'local', 'constituencyquota'))
        if public == local:
            continue
        quota = ('public' if public else 'mla') + ('' if is_available else '_stock')
        leaf = _normal(labels[-1])
        if leaf in ('ಒಟ್ಟು', 'total'):
            category = 'Total'
        elif 'ಅಲ್ಪಸಂಖ್ಯಾ' in leaf or leaf in ('minority', 'mino', 'min'):
            category = 'Minority'
        elif 'ಸಾಮಾನ್ಯ' in leaf or leaf in ('general', 'gen'):
            category = 'General'
        elif ('ಪಜಾ' in leaf and 'ಪಪಂ' in leaf) or leaf in ('sc', 'scst', 'scheduledcastescheduledtribe'):
            category = 'SC'
        else:
            continue
        if category in columns[quota]:
            raise ValueError(f'Duplicate {quota} available column {category}; report retained.')
        columns[quota][category] = (col, labels)
    for quota in columns:
        if set(columns[quota]) != {'SC', 'General', 'Minority', 'Total'}:
            raise ValueError(f'Cannot identify all {quota} Available headers; report retained.')
    result = []
    for _, row in data_rows:
        location = next(c for c in row if c and c.get('locationId'))
        entry = {'location_kn': location['text'].strip(), 'location_id': location['locationId']}
        for quota in columns:
            values = {}
            for category, (col, labels) in columns[quota].items():
                if col >= len(row) or not row[col] or row[col].get('colSpan', 1) != 1:
                    raise ValueError('Missing or merged location count; report retained.')
                value = row[col]['text'].strip().replace(',', '')
                if not re.fullmatch(r'-?\d+', value):
                    raise ValueError('Missing/non-numeric available count; report retained.')
                values[category] = value
            values['source_headers'] = {key: labels for key, (_, labels) in columns[quota].items()}
            entry[quota] = values
        result.append(entry)
    return result

