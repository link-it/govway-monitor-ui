RELEASE=$1
if [ -z "${RELEASE}" ]
then
	echo "Tipo di build non fornito"
	echo "Error; usage: ./build.sh snapshot|release"
	exit 2
fi
if [ ! "snapshot" == "${RELEASE}" -a ! "release" == "${RELEASE}" ]
then
	echo "Tipo di build '${RELEASE}' sconosciuto"
	echo "Error; usage: ./build.sh snapshot|release"
	exit 3
fi

java -fullversion > out.txt 2>&1
JAVA_VERSION=$(cat out.txt)
RESULT=$(cat out.txt | grep "11")
rm -f out.txt

if [ -z "${RESULT}" ]
then
	echo "Richiesta java version 11, trovata: ${JAVA_VERSION}"
fi

find . -name target | xargs rm -rf
export MAVEN_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=2048m"
mvn install

VERSION=$(ls package/target/govway-monitor-ui-*.jar  | cut -d '-' -f 4 | cut -d '.' -f 1)
if [ -z "${VERSION}" ]
then
	echo "Versione libreria non trovata in package/target/govway-monitor-ui-*.jar"
fi

GROUP_ID="org.govway-monitor-ui"
bash package/script/deploy.sh package/target/govway-monitor-ui-${VERSION}.jar govway-monitor-ui ${GROUP_ID} ${VERSION} ${RELEASE}
