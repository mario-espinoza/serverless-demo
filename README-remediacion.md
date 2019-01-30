# Remediación
Tres escenarios posibles:

##Exclusiones (o borrado):
    Quitar de las dependendencies del pom, los artefactos definidos en listado.

##Stash:
    Reemplazar un listado jars definidos tanto en el repositorio maven (carpeta E:/.m2) como en la carpeta PROJECTHOME/ear/libs, con PROJECTHOME la raíz del proyecto.

##Remediación del Jar desde Cero:
    Si está el repositorio, se genera un nuevo JAR a partir del proyecto
    Si no está, se debe decompilar y generar un nuevo proyecto a partir de este.
    Luego reemplazar dichos JAR en la carpeta ./ear/libs y volver a construir el proyecto


## Exclusiones
Procedimiento

* Descargar el repositorio
* Construir el proyecto, generalmente ejecutando el comando build.bat en la raiz del proyecto.
    Recordar que el orden de build es el siguiente
    ./dependency-management/build_dependencies.bat
    ./parent-pom/build_parent.bat
    ./build.bat
* Ir a carpeta ./ear/ ejecutar: mvn dependency:tree -DoutputFile=./filename.txt
* Se revisa que el JAR indicado en la lista no se encuentre en el archivo anterior.
    Si existe, se debe agregar una exclusion al ./ear/pom.xml

Ej:    
Supongamos que el contenido de filename.txt es el siguiente y debemos excluir ic-ds-latam-equifax-pe-eapp-integration
```
com.equifax.intlps.ic.solution.cl.javer:ic-javer-ear:ear:1.0.3.GA
+- com.equifax.ic.ps.component.infrastructure:ic-security-server:jar:1.0.3.GA:compile
|  +- commons-lang:commons-lang:jar:2.6:compile (version managed from 2.3)
|  +- com.equifax.ic.core.component.infrastructure:ic-logging-core:jar:5.3.0:compile
|  +- com.equifax.ic.international.datasource.latam.equifax.pe-eapp:>ic-ds-latam-equifax-pe-eapp-integration:jar.x.x.x:compile
|  +- com.equifax.ic.core.component.infrastructure:ic-configuration-core:jar:5.3.0:compile
|  +- com.equifax.ic.core.component.infrastructure:ic-configuration-extension:jar:5.4.1:compile (version managed from 5.3.0)
|  |  +- commons-io:commons-io:jar:1.2:compile
|  +-
```
Identificamos que en la linea 5 se encuentra la dependenencia al artefacto buscado.
Debemos encontrar el jar padre definido en las dependencias del proyeto, en este caso: com.equifax.ic.ps.component.infrastructure:ic-security-server

```xml
<dependencies>
   <dependency> 
        <groupId>com.equifax.ic.ps.component.infrastructure</groupId>
        <artifactId>ic-security-server</artifactId>
    </dependency> 
</dependencies
```

Luego insertamos un tag de exclusion en el grupo exclusions dentro del nodo correspondiente
```xml
<exclusions>
    <exclusion>
        <groupId>com.equifax.ic.international.datasource.latam.equifax.pe-eapp</groupId>
        <artifactId>ic-ds-latam-equifax-pe-eapp-integration</artifactId>
    </exclusion>
</exclusions>
```
El resultado debe ser el siguiente.
```xml
<dependencies>
   <dependency> 
        <groupId>com.equifax.ic.ps.component.infrastructure</groupId>
        <artifactId>ic-security-server</artifactId>
        <exclusions>
            <exclusion>
                <groupId>com.equifax.ic.international.datasource.latam.equifax.pe-eapp</groupId>
                <artifactId>ic-ds-latam-equifax-pe-eapp-integration</artifactId>
            </exclusion>
        </exclusions>
    </dependency> 
</dependencies>
```
* Luego ejecutamos el comando : mvn clean install -Dmaven.skip.test=true

* A continuación, debemos ir a la carpeta ../package y si existe el comando build_kit.bat, ejecutarlo, de lo contrario ejecutar el comando:
```
mvn clean install -Dmaven.test.skip=true -DrunGeneratedSources=true -DrunSql=false -DdropAndRecreateDB=true -DassembleApp -DinstallActiveMQJCA=true -DasynchronousEventsPersistence=true -DasynchronousDatasourcePersistence=true -DinstallRulesXU=true -DJavaEEkit
```
Este comando generará un ZIP con todas las dependencias del proyecto en la carpeta PROJECTHOME/package/target
Dentro de dicho archivo zip se encuentar una carpeta ./ear con un archivo .war con los contenidos del proyecto y sus dependencias.
