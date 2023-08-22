RELEASE=$1
if [ -z "${RELEASE}" ]
then
	echo "Tipo di build non fornito"
	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
	exit 2
fi
if [ ! "snapshot" == "${RELEASE}" -a ! "release" == "${RELEASE}" ]
then
	echo "Tipo di build '${RELEASE}' sconosciuto"
	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
	exit 3
fi

UPLOAD=$2
if [ -z "${UPLOAD}" ]
then
	UPLOAD=false
fi
if [ ! "${UPLOAD}" == "true" -a ! "${UPLOAD}" == "false" ]
then
	echo "Indicazione upload non valida '${UPLOAD}'"
	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
	exit 4
fi

java -fullversion > out.txt 2>&1
JAVA_VERSION=$(cat out.txt)
RESULT=$(cat out.txt | grep "17")
rm -f out.txt

if [ -z "${RESULT}" ]
then
	echo "Richiesta java version 17, trovata: ${JAVA_VERSION}"
fi

find . -name target | xargs rm -rf
export MAVEN_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=2048m --add-opens=java.base/java.lang=ALL-UNNAMED"
mvn install

VERSION=$(ls package/target/govway-monitor-ui-*.jar  | cut -d '-' -f 4 | cut -d '.' -f 1)
if [ -z "${VERSION}" ]
then
	echo "Versione libreria non trovata in package/target/govway-monitor-ui-*.jar"
fi

if [ "UPLOAD" == "true" ]
then
	echo "Upload to maven repository ..."
	GROUP_ID="org.govway-monitor-ui"
	bash package/script/deploy.sh package/target/govway-monitor-ui-${VERSION}.jar govway-monitor-ui ${GROUP_ID} ${VERSION} ${RELEASE}
	echo "Upload to maven repository finished"
fi
