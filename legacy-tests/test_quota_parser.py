import unittest
import json
from pathlib import Path
from quota_parser import parse_quota_table


class QuotaParserTests(unittest.TestCase):
    def fixture(self):
        return json.loads((Path(__file__).parent / 'fixtures/krpuram-table.json').read_text())

    def test_grouped_headers_use_available_not_total_or_allotted(self):
        rows = parse_quota_table(self.fixture())
        horamavu = rows[1]
        self.assertEqual(horamavu['location_kn'], 'ಹೊರಮಾವು ಆಗರ')
        self.assertEqual([horamavu['mla'][k] for k in ['SC', 'General', 'Minority', 'Total']], ['24', '35', '2', '61'])
        self.assertEqual(horamavu['public']['Total'], '0')
        self.assertNotIn(horamavu['mla']['Total'], ['96', '35'])
        self.assertEqual(rows[0]['mla']['Total'], '110')
        self.assertEqual(rows[2]['mla']['SC'], '10')

    def test_stock_separate_from_availability(self):
        rows = parse_quota_table(self.fixture())
        self.assertEqual(rows[1]['public_stock']['Total'], '96')
        self.assertEqual(rows[1]['mla_stock']['Total'], '96')
        self.assertEqual(rows[1]['public']['Total'], '0')

    def test_negative_availability_preserved(self):
        fixture = self.fixture()
        fixture[4]['cells'][-1]['text'] = '-3'
        self.assertEqual(parse_quota_table(fixture)[1]['mla']['Total'], '-3')

    def test_missing_available_group_aborts(self):
        fixture = self.fixture()
        fixture[1]['cells'][-1]['text'] = 'Unknown status'
        with self.assertRaises(ValueError):
            parse_quota_table(fixture)

    def test_missing_data_cell_aborts(self):
        fixture = self.fixture()
        fixture[4]['cells'].pop()
        with self.assertRaises(ValueError):
            parse_quota_table(fixture)

    def test_quota_order_can_change(self):
        fixture = self.fixture()
        fixture[0]['cells'][2:] = list(reversed(fixture[0]['cells'][2:]))
        for row in fixture[3:]:
            row['cells'][2:] = row['cells'][14:] + row['cells'][2:14]
        parsed = parse_quota_table(fixture)
        self.assertEqual(parsed[1]['mla']['Total'], '61')
        self.assertEqual(parsed[1]['public']['Total'], '0')

    def test_non_numeric_count_aborts(self):
        fixture = self.fixture()
        fixture[4]['cells'][-1]['text'] = 'N/A'
        with self.assertRaises(ValueError):
            parse_quota_table(fixture)

    def test_zero_is_retained(self):
        rows = parse_quota_table(self.fixture())
        self.assertEqual(rows[1]['public']['SC'], '0')
        self.assertEqual(rows[1]['public']['Total'], '0')


if __name__ == '__main__':
    unittest.main()
