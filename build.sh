#RELEASE=$1
#if [ -z "${RELEASE}" ]
#then
#	echo "Tipo di build non fornito"
#	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
#	exit 2
#fi
#if [ ! "snapshot" == "${RELEASE}" -a ! "release" == "${RELEASE}" ]
#then
#	echo "Tipo di build '${RELEASE}' sconosciuto"
#	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
#	exit 3
#fi

UPLOAD=$1
if [ -z "${UPLOAD}" ]
then
	echo "Error; usage: ./build.sh [predisposizione progetto maven central:true/false]"
	exit 4
fi
if [ ! "${UPLOAD}" == "true" -a ! "${UPLOAD}" == "false" ]
then
	echo "Indicazione upload non valida '${UPLOAD}'"
	echo "Error; usage: ./build.sh [upload:true/false]"
	exit 4
fi

java -fullversion > out.txt 2>&1
JAVA_VERSION=$(cat out.txt)
RESULT=$(cat out.txt | grep "21")
rm -f out.txt

if [ -z "${RESULT}" ]
then
	echo "Richiesta java version 21, trovata: ${JAVA_VERSION}"
	exit 5
fi

find . -name target | xargs rm -rf
export MAVEN_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=2048m --add-opens=java.base/java.lang=ALL-UNNAMED"
mvn install

VERSION=$(ls package/components/target/govway-monitor-ui-components-*.jar  | cut -d '-' -f 5 | cut -d '.' -f 1)
if [ -z "${VERSION}" ]
then
	echo "Versione libreria non trovata in package/components/target/govway-monitor-ui-components-*.jar"
	exit 6
fi

if [ "${UPLOAD}" == "true" ]
then
	echo "Prepare maven central repository project ..."

	bash package/script/build.sh ${VERSION}

	echo "Prepare maven central repository project finished"
	
	echo ""
	echo "!! Attenzione !!"
	echo "!!!! Effettuare un rilascio solamente di una tag version !!!!!"
	echo ""
	echo "Per completare il deploy su maven central:"
	echo "cd govway-monitor-ui-jsf; mvn clean deploy;"
	echo "cd govway-monitor-ui-api; mvn clean deploy;"
	echo "cd govway-monitor-ui-components; mvn clean deploy;"
fi
