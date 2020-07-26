def get_path(platform, libname):
    return {
        'wkhtmltopdf': get_path_wkhtmlto(platform),
        'wkhtmltoimage': get_path_wkhtmlto(platform, pdf=False),
    }[libname]

def get_path_wkhtmlto(platform, pdf=True):
    dir = 'third_party_lib/wkhtmltopdf'
    return {
        'win32': '',
        'darwin': f'{dir}/darwin/wkhtmlto{"pdf" if pdf else "image"}',
        'linux': '',
    }[platform]
