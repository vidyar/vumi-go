import uuid
from optparse import make_option

from go.base.command_utils import BaseGoAccountCommand, CommandError


class Command(BaseGoAccountCommand):
    help = "Give a Vumi Go user access to a certain tagpool"

    LOCAL_OPTIONS = [
        make_option('--tagpool',
            dest='tagpool',
            help='The tagpool to give access to'),
        make_option('--max-keys',
            dest='max_keys',
            help='Maximum number of keys that can be acquired '
                    '(0 == Unlimited)'),
        make_option('--update',
            dest='update',
            action='store_true',
            default=False,
            help='Update an existing permission with a new max-keys value'),
    ]
    option_list = BaseGoAccountCommand.option_list + tuple(LOCAL_OPTIONS)

    def handle_no_command(self, *args, **options):
        options = options.copy()
        for opt in self.LOCAL_OPTIONS:
            if options.get(opt.dest) is None:
                value = raw_input("%s: " % (opt.help,))
                if value:
                    options[opt.dest] = value
                else:
                    raise CommandError('Please provide %s:' % (opt.dest,))

        self.handle_validated(*args, **options)

    def handle_validated(self, *args, **options):
        tagpool = unicode(options['tagpool'])
        max_keys = int(options['max_keys']) or None

        account = self.user_api.get_user_account()
        existing_tagpools = []
        for permissions in account.tagpools.load_all_bunches():
            existing_tagpools.extend([
                p for p in permissions if p.tagpool == tagpool])

        if existing_tagpools:
            if options['update']:
                if len(existing_tagpools) == 1:
                    self.update_permission(existing_tagpools[0], max_keys)
                else:
                    raise CommandError('%s permissions specified for '
                        'the same tagpool. Please fix manually' % (
                            len(existing_tagpools),))
            else:
                raise CommandError('Permission already exists, use '
                    '--update to update the value of max-keys')
        else:
            self.create_permission(account, tagpool, max_keys)

    def update_permission(self, tagpool_permission, max_keys):
        tagpool_permission.max_keys = max_keys
        tagpool_permission.save()

    def create_permission(self, account, tagpool, max_keys):
        api = self.user_api.api

        if tagpool not in api.tpm.list_pools():
            raise CommandError("Tagpool '%s' does not exist" % (tagpool,))

        permission = api.account_store.tag_permissions(uuid.uuid4().hex,
            tagpool=tagpool, max_keys=max_keys)
        permission.save()

        account.tagpools.add(permission)
        account.save()
