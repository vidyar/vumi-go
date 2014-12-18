from twisted.trial.unittest import TestCase

from go.apps.http_api_nostream.resource import (
    MsgOptions, SendToOptions, ReplyToOptions)


def validate_even_not_multiple_of_odd(payload, api_config):
    factor = api_config.get("factor")
    if factor is not None:
        if payload["even"] == factor * payload["odd"]:
            return "even == %s * odd" % (factor,)
    return None


class ToyMsgOptions(MsgOptions):
    WHITELIST = {
        "even": (lambda v: v is None or bool((v % 2) == 0)),
        "odd": (lambda v: v is None or bool((v % 2) == 1)),
    }

    VALIDATION = (
        validate_even_not_multiple_of_odd,
    )


class TestMsgOptions(TestCase):

    def assert_no_attribute(self, obj, attr):
        self.assertRaises(AttributeError, getattr, obj, attr)

    def test_no_errors(self):
        opts = ToyMsgOptions({"even": 4, "odd": 5}, {})
        self.assertTrue(opts.is_valid)
        self.assertEqual(opts.errors, [])
        self.assertEqual(opts.error_msg, None)
        self.assertEqual(opts.even, 4)
        self.assertEqual(opts.odd, 5)

    def test_white_listing(self):
        opts = ToyMsgOptions({"bad": 5}, {})
        self.assertTrue(opts.is_valid)
        self.assert_no_attribute(opts, "bad")

    def test_validation_pass(self):
        opts = ToyMsgOptions({"even": 4, "odd": 3}, {"factor": 2})
        self.assertTrue(opts.is_valid)

    def test_validation_fail(self):
        opts = ToyMsgOptions({"even": 6, "odd": 3}, {"factor": 2})
        self.assertFalse(opts.is_valid)
        self.assertEqual(opts.errors, ["even == 2 * odd"])
        self.assertEqual(opts.error_msg, "even == 2 * odd")

    def test_single_error(self):
        opts = ToyMsgOptions({"even": 5, "odd": 7}, {})
        self.assertFalse(opts.is_valid)
        self.assertEqual(opts.errors, [
            "Invalid or missing value for payload key 'even'",
        ])
        self.assertEqual(
            opts.error_msg,
            "Invalid or missing value for payload key 'even'"
        )
        self.assert_no_attribute(opts, "even")
        self.assertEqual(opts.odd, 7)

    def test_many_errors(self):
        opts = ToyMsgOptions({"even": 3, "odd": 4}, {})
        self.assertFalse(opts.is_valid)
        self.assertEqual(opts.errors, [
            "Invalid or missing value for payload key 'even'",
            "Invalid or missing value for payload key 'odd'",
        ])
        self.assertEqual(
            opts.error_msg,
            "Errors:"
            "\n* Invalid or missing value for payload key 'even'"
            "\n* Invalid or missing value for payload key 'odd'"
        )
        self.assert_no_attribute(opts, "even")
        self.assert_no_attribute(opts, "odd")


class TestSendToOptions(TestCase):

    def assert_no_attribute(self, obj, attr):
        self.assertRaises(AttributeError, getattr, obj, attr)

    def test_content_whitelist(self):
        self.assertTrue(SendToOptions({"content": None}, {}).is_valid)
        self.assertTrue(SendToOptions({"content": u"nicode"}, {}).is_valid)
        self.assertFalse(SendToOptions({"content": "str"}, {}).is_valid)
        self.assertFalse(SendToOptions({"content": 123}, {}).is_valid)

    def test_to_addr_whitelist(self):
        self.assertTrue(SendToOptions({"to_addr": None}, {}).is_valid)
        self.assertTrue(SendToOptions({"to_addr": u"nicode"}, {}).is_valid)
        self.assertFalse(SendToOptions({"to_addr": "str"}, {}).is_valid)
        self.assertFalse(SendToOptions({"to_addr": 123}, {}).is_valid)

    def test_white_listing(self):
        opts = SendToOptions({"bad": 5}, {})
        self.assertTrue(opts.is_valid)
        self.assert_no_attribute(opts, "bad")

    def test_content_length_validation(self):
        self.assertTrue(SendToOptions({"content": None}, {}).is_valid)
        self.assertTrue(SendToOptions({"content": u"12345"}, {}).is_valid)

        opts = SendToOptions({"content": None}, {"content_length_limit": 5})
        self.assertTrue(opts.is_valid)

        opts = SendToOptions({"content": u"1234"}, {"content_length_limit": 4})
        self.assertTrue(opts.is_valid)

        opts = SendToOptions({"content": u"1234"}, {"content_length_limit": 3})
        self.assertFalse(opts.is_valid)


class TestReplyToOptions(TestCase):

    def assert_no_attribute(self, obj, attr):
        self.assertRaises(AttributeError, getattr, obj, attr)

    def test_content_whitelist(self):
        self.assertTrue(ReplyToOptions({"content": None}, {}).is_valid)
        self.assertTrue(ReplyToOptions({"content": u"nicode"}, {}).is_valid)
        self.assertFalse(ReplyToOptions({"content": "str"}, {}).is_valid)
        self.assertFalse(ReplyToOptions({"content": 123}, {}).is_valid)

    def test_session_event_whitelist(self):
        self.assertTrue(ReplyToOptions({"session_event": None}, {}).is_valid)
        self.assertTrue(ReplyToOptions({"session_event": "new"}, {}).is_valid)
        self.assertFalse(ReplyToOptions({"session_event": "bar"}, {}).is_valid)
        self.assertFalse(ReplyToOptions({"session_event": 123}, {}).is_valid)

    def test_white_listing(self):
        opts = ReplyToOptions({"bad": 5}, {})
        self.assertTrue(opts.is_valid)
        self.assert_no_attribute(opts, "bad")

    def test_content_length_validation(self):
        self.assertTrue(ReplyToOptions({"content": None}, {}).is_valid)
        self.assertTrue(ReplyToOptions({"content": u"12345"}, {}).is_valid)

        opts = ReplyToOptions({"content": None}, {"content_length_limit": 5})
        self.assertTrue(opts.is_valid)

        opts = ReplyToOptions({"content": u"123"}, {"content_length_limit": 3})
        self.assertTrue(opts.is_valid)

        opts = ReplyToOptions({"content": u"123"}, {"content_length_limit": 2})
        self.assertFalse(opts.is_valid)
