git filter-repo --commit-callback '
if commit.author_name == b"kaushal-waygood":
    commit.author_name = b"Jayavardhan"
    commit.author_email = b"your-email@example.com"
if commit.committer_name == b"kaushal-waygood":
    commit.committer_name = b"Jayavardhan"
    commit.committer_email = b"your-email@example.com"
'

git filter-repo --commit-callback '
if commit.author_name == b"kaushal-waygood":
    commit.author_name = b"Jayavardhan"
    commit.author_email = b"jvr.vardhan@gmail.com"
if commit.committer_name == b"kaushal-waygood":
    commit.committer_name = b"Jayavardhan"
    commit.committer_email = b"jvr.vardhan@gmail.com"
'