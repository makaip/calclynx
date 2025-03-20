import os

output_file = 'out.txt'
if os.path.exists(output_file):
    open(output_file, 'w').close()

def is_hidden(filepath):
    return any(part.startswith('.') for part in filepath.split(os.sep))

def get_all_files(directory, exclude_files):
    all_files = []
    for root, _, files in os.walk(directory):
        if is_hidden(root):
            continue
        for file in files:
            if file not in exclude_files and not file.startswith('.'):
                all_files.append(os.path.join(root, file))
    return all_files

def write_to_output_file(files, output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        for file in files:
            try:
                with open(file, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    # Write filename as title
                    f.write(f"=== {file} ===\n")
                    f.write(content + "\n\n")
            except UnicodeDecodeError:
                print(f"Could not read {file} due to encoding error.")

if __name__ == "__main__":
    current_directory = os.path.dirname(os.path.abspath(__file__))
    exclude_files = ['exp.py', '.gitattributes', '.gitignore', 'out.txt', 'README.md', 'LICENSE', 'requirements.txt',
                     'navigation.js', 'versionmanager.js', 'filemanager.js', 'contextmenu.js']
    output_file = 'out.txt'

    all_files = get_all_files(current_directory, exclude_files)
    write_to_output_file(all_files, output_file)
