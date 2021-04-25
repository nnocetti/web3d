# web3d

## Importar modules en el navegador un parto!!!!!
Ver -> https://glitch.com/edit/#!/three-import-map?path=README.md
Usa -> https://github.com/guybedford/es-module-shims

Si queremos three.js local:

instalamos con npm three.js

copiamos a /js/modules

Sino lo levantamos de unpkg.com

En cualquier caso definimos el import map en el /index.html

Los que siempre tenemos que instalar son los types con la opcion --save-dev ya que son los que vamos a incluir en typescript

https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/three

pero si instalamos three.js no es necesario instalarlo con --save-dev, ya que desde el compilador no se utiliza.