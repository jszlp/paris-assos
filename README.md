# INTRODUCTION :

The aim of this project is to present a dashboard of different measurements concerning the subventions 
offered by the administration of the city of Paris to its associations.
The project offers also a search tool to discover the subventions received by each association.

# LINK TO PROJECT :

https://paris-assos.web.app

# PREREQUISITES :

Python 3.11
Sass

# PREPROCESSING : 

## COMMANDS :

Use preprocessing directory as working directory, then :

1. Install a new venv using Python3.11 : 

```/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv .venv```

2. Activate the virtual environment :

```source .venv/bin/activate```

3. Install packages using a requirements file:

```pip3.11 install -r requirements.txt```

4. Launch jupyter notebook :

```jupyter notebook```

5. Desactivate the virtual environment when turning off the project:

```deactivate```

## REMARKS :

If the jupyter-notebook does not work, perform the following instructions :

1. Deactivate the environment:

```deactivate```

2. Delete the .venv folder

3. Perform in order the instructions from the COMMANDS section

# WEB :

## COMMANDS :

Use web directory as working directory :

1. Compile CSS files :

```sass ./style/scss/index.scss ./style/css/index.css```
```sass ./style/scss/association.scss ./style/css/association.css```

2. Launch HTTP server :

```python -m http.server```



